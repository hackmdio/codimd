/** !
 * Google Drive File Picker Example
 * By Daniel Lo Nigro (http://dan.cx/)
 */
(function () {
  /**
   * Initialise a Google Driver file picker
   */
  var FilePicker = window.FilePicker = function (options) {
    // Config
    this.apiKey = options.apiKey
    this.clientId = options.clientId

    // Elements
    this.buttonEl = options.buttonEl

    // Events
    this.onSelect = options.onSelect
    this.buttonEl.on('click', this.open.bind(this))

    // Disable the button until the API loads, as it won't work properly until then.
    this.buttonEl.prop('disabled', true)

    // Load the drive API
    window.gapi.client.setApiKey(this.apiKey)
    window.gapi.client.load('drive', 'v2', this._driveApiLoaded.bind(this))
    window.google.load('picker', '1', { callback: this._pickerApiLoaded.bind(this) })
  }

  FilePicker.prototype = {
    /**
     * Open the file picker.
     */
    open: function () {
      // Check if the user has already authenticated
      var token = window.gapi.auth.getToken()
      if (token) {
        this._showPicker()
      } else {
        // The user has not yet authenticated with Google
        // We need to do the authentication before displaying the Drive picker.
        this._doAuth(false, function () { this._showPicker() }.bind(this))
      }
    },

    /**
     * Show the file picker once authentication has been done.
     * @private
     */
    _showPicker: function () {
      var accessToken = window.gapi.auth.getToken().access_token
      var view = new window.google.picker.DocsView()
      view.setMimeTypes('text/markdown,text/html')
      view.setIncludeFolders(true)
      view.setOwnedByMe(true)
      this.picker = new window.google.picker.PickerBuilder()
                      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
                      .addView(view)
                      .setAppId(this.clientId)
                      .setOAuthToken(accessToken)
                      .setCallback(this._pickerCallback.bind(this))
                      .build()
                      .setVisible(true)
    },

    /**
     * Called when a file has been selected in the Google Drive file picker.
     * @private
     */
    _pickerCallback: function (data) {
      if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
        var file = data[window.google.picker.Response.DOCUMENTS][0]
        var id = file[window.google.picker.Document.ID]
        var request = window.gapi.client.drive.files.get({
          fileId: id
        })
        request.execute(this._fileGetCallback.bind(this))
      }
    },
    /**
     * Called when file details have been retrieved from Google Drive.
     * @private
     */
    _fileGetCallback: function (file) {
      if (this.onSelect) {
        this.onSelect(file)
      }
    },

    /**
     * Called when the Google Drive file picker API has finished loading.
     * @private
     */
    _pickerApiLoaded: function () {
      this.buttonEl.prop('disabled', false)
    },

    /**
     * Called when the Google Drive API has finished loading.
     * @private
     */
    _driveApiLoaded: function () {
      this._doAuth(true)
    },

    /**
     * Authenticate with Google Drive via the Google JavaScript API.
     * @private
     */
    _doAuth: function (immediate, callback) {
      window.gapi.auth.authorize({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        immediate: immediate
      }, callback || function () {})
    }
  }
}())
