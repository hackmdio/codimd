Authentication guide - Twitter
===

***Note:** This guide was written before the renaming. Just replace `HackMD` with `CodiMD` in your mind :smile: thanks!*

1. Sign-in or sign-up for a Twitter account
2. Go to the Twitter Application management page [here](https://apps.twitter.com/)
3. Click on the **Create New App** button to create a new Twitter app:

![create-twitter-app](../images/auth/create-twitter-app.png)

4. Fill out the create application form, check the developer agreement box, and click **Create Your Twitter Application**

![register-twitter-application](../images/auth/register-twitter-application.png)

*Note: you may have to register your phone number with Twitter to create a Twitter application*

To do this Click your profile icon --> Settings and privacy --> Mobile  --> Select Country/region --> Enter phone number --> Click Continue

5. After you receive confirmation that the Twitter application was created, click **Keys and Access Tokens**

![twitter-app-confirmation](../images/auth/twitter-app-confirmation.png)

6. Obtain your Twitter Consumer Key and Consumer Secret

![twitter-app-keys](../images/auth/twitter-app-keys.png)

7.  Add your Consumer Key and Consumer Secret to your config.json file or pass them as environment variables:
    * config.json:
      ````javascript
      {
        "production": {
          "twitter": {
              "consumerKey": "esTCJFXXXXXXXXXXXXXXXXXXX",
              "consumerSecret": "zpCs4tU86pRVXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          }
        }
      }
      ````
    * environment variables:
      ````
      HMD_TWITTER_CONSUMERKEY=esTCJFXXXXXXXXXXXXXXXXXXX
      HMD_TWITTER_CONSUMERSECRET=zpCs4tU86pRVXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
      ````
