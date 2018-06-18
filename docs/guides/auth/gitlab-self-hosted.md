# GitLab (self-hosted)
===

1. Sign in to your GitLab
2. Navigate to the application management page at `https://your.gitlab.domain/admin/applications` (admin permissions required)
3. Click **New application** to create a new application and fill out the registration form:

![New GitLab application](images/auth/gitlab-new-application.png)

4. Click **Submit**
5. In the list of applications select **HackMD**. Leave that site open to copy the application ID and secret in the next step.

![Application: HackMD](images/auth/gitlab-application-details.png)


6. In the `docker-compose.yml` add the following environment variables to `app:` `environment:`

```
- HMD_DOMAIN=your.hackmd.domain
- HMD_URL_ADDPORT=443
- HMD_PROTOCOL_USESSL=true
- HMD_GITLAB_BASEURL=https://your.gitlab.domain
- HMD_GITLAB_CLIENTID=23462a34example99XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
- HMD_GITLAB_CLIENTSECRET=5532e9dexamplXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

7. Run `docker-compose up -d` to apply your settings.
8. Sign in to your HackMD using your GitLab ID:

![Sign in via GitLab](images/auth/gitlab-sign-in.png)
