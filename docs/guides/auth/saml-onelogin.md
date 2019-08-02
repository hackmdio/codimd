Authentication guide - SAML (OneLogin)
===

1. Sign-in or sign-up for an OneLogin account. (available free trial for 2 weeks)
2. Go to the administration page.
3. Select the **APPS** menu and click on the **Add Apps**.

![onelogin-add-app](../images/auth/onelogin-add-app.png)

4. Find "SAML Test Connector (SP)" for template of settings and select it.

![onelogin-select-template](../images/auth/onelogin-select-template.png)

5. Edit display name and icons for OneLogin dashboard as you want, and click **SAVE**.

![onelogin-edit-app-name](../images/auth/onelogin-edit-app-name.png)

6. After that other tabs will appear, click the **Configuration**, and fill out the below items, and click **SAVE**.
    * RelayState: The base URL of your hackmd, which is issuer. (last slash is not needed)
    * ACS (Consumer) URL Validator: The callback URL of your hackmd. (serverurl + /auth/saml/callback)
    * ACS (Consumer) URL: same as above.
    * Login URL: login URL(SAML requester) of your hackmd. (serverurl + /auth/saml)

![onelogin-edit-sp-metadata](../images/auth/onelogin-edit-sp-metadata.png)

7. The registration is completed. Next, click **SSO** and copy or download the items below.
    * X.509 Certificate: Click **View Details** and **DOWNLOAD** or copy the content of certificate ....(A)
    * SAML 2.0 Endpoint (HTTP): Copy the URL ....(B)

![onelogin-copy-idp-metadata](../images/auth/onelogin-copy-idp-metadata.png)

8. In your hackmd server, create IdP certificate file from (A)
9. Add the IdP URL (B) and the Idp certificate file path to your config.json file or pass them as environment variables.
    * config.json:
      ````javascript
      {
        "production": {
          "saml": {
            "idpSsoUrl": "https://*******.onelogin.com/trust/saml2/http-post/sso/******",
            "idpCert": "/path/to/idp_cert.pem"
          }
        }
      }
      ````
    * environment variables
      ````
      HMD_SAML_IDPSSOURL=https://*******.onelogin.com/trust/saml2/http-post/sso/******
      HMD_SAML_IDPCERT=/path/to/idp_cert.pem
      ````
10. Try sign-in with SAML from your hackmd sign-in button or OneLogin dashboard (like the screenshot below).

![onelogin-use-dashboard](../images/auth/onelogin-use-dashboard.png)
