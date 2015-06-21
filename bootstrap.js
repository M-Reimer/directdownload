/*
DirectDownload - Addon which allows direct download of links or from url bar
Copyright (C) 2015  Manuel Reimer <manuel.reimer@gmx.de>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

Components.utils.import("resource://gre/modules/Services.jsm");

function startup(data, reason) {
  // Get the list of browser windows already open
  var windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    var domWindow = windows.getNext()
                           .QueryInterface(Components.interfaces.nsIDOMWindow);
    SetupBrowserUI(domWindow);
  }

  // Wait for any new browser windows to open
  Services.wm.addListener(WindowListener);

  // Set the default value for preferences
  var branch = Services.prefs.getDefaultBranch("extensions.directdownload.");
  branch.setBoolPref("urlbarShiftSave", true);
}

function shutdown(data, reason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (reason == APP_SHUTDOWN)
    return;

  // Get the list of browser windows already open
  var windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    var domWindow = windows.getNext()
                           .QueryInterface(Components.interfaces.nsIDOMWindow);
    TearDownBrowserUI(domWindow);
  }

  // Stop listening for any new browser windows to open
  Services.wm.removeListener(WindowListener);
}

function install(data, reason) {
  if (reason != ADDON_INSTALL)
    return;

  Services.prefs.setBoolPref("browser.altClickSave", true);
}

function uninstall(data, reason) {
  if (reason != ADDON_UNINSTALL)
    return;

  var pref = "browser.altClickSave";
  if (Services.prefs.prefHasUserValue(pref))
    Services.prefs.clearUserPref(pref);
}


var WindowListener = {
  onOpenWindow: function(xulWindow) {
    var domWindow = xulWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                             .getInterface(Components.interfaces.nsIDOMWindow);

    // Wait for new window to finish loading
    domWindow.addEventListener("load", function listener() {
      domWindow.removeEventListener("load", listener, false);

      // If this is a browser window then setup its UI
      if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser")
        SetupBrowserUI(domWindow);
    }, false);
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
};

function SetupBrowserUI(window) {
  var urlbar = window.document.getElementById("urlbar");
  urlbar.addEventListener("keydown", OnUrlbarKeyUp, false);
}

function TearDownBrowserUI(window) {
  var urlbar = window.document.getElementById("urlbar");
  urlbar.removeEventListener("keydown", OnUrlbarKeyUp, false);
}

function OnUrlbarKeyUp(aEvent) {
  // Only handle the event coming directly from the original target
  if (aEvent.target != aEvent.originalTarget)
    return;

  // We are only interested in the "Shift+Enter" event
  if (aEvent.keyCode != aEvent.DOM_VK_RETURN || !aEvent.shiftKey)
    return;

  // Check user settings first
  if (!Services.prefs.getBoolPref("extensions.directdownload.urlbarShiftSave"))
    return;

  aEvent.stopPropagation();
  aEvent.preventDefault();

  const nsIURIFixup = Components.interfaces.nsIURIFixup;
  var url = aEvent.target.value;
  var urifixup = Components.classes["@mozilla.org/docshell/urifixup;1"]
                           .getService(nsIURIFixup);
  var uri = urifixup.createFixupURI(url, nsIURIFixup.FIXUP_FLAGS_MAKE_ALTERNATE_URI);

  var window = aEvent.target.ownerGlobal;
  if (uri)
    window.saveURL(uri.spec, null, null, false, true, null, window.document);
    //        aURL -^         ^     ^     ^      ^     ^     ^
    //        aFileName ------'     |     |      |     |     |
    //        aFilePickerTitleKey --'     |      |     |     |
    //        aShouldBypassCache ---------'      |     |     |
    //        aSkipPrompt -----------------------'     |     |
    //        aReferrer -------------------------------'     |
    //        aSourceDocument -------------------------------'
}
