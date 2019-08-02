AD LDAP auth
===


To setup your HackMD instance with Active Directory you need the following configs:

```
HMD_LDAP_URL=ldap://internal.example.com
HMD_LDAP_BINDDN=cn=binduser,cn=Users,dc=internal,dc=example,dc=com
HMD_LDAP_BINDCREDENTIALS=<super secret password>
HMD_LDAP_SEARCHBASE=dc=internal,dc=example,dc=com
HMD_LDAP_SEARCHFILTER=(&(objectcategory=person)(objectclass=user)(|(sAMAccountName={{username}})(mail={{username}})))
HMD_LDAP_USERIDFIELD=sAMAccountName
HMD_LDAP_PROVIDERNAME=Example Inc AD
```


`HMD_LDAP_BINDDN` is either the `distinguishedName` or the `userPrincipalName`. *This can cause "username/password is invalid" when either this value or the password from `HMD_LDAP_BINDCREDENTIALS` are incorrect.*

`HMD_LDAP_SEARCHFILTER` matches on all users and uses either the email address or the `sAMAccountName` (usually the login name you also use to login to Windows).

*Only using `sAMAccountName` looks like this:* `(&(objectcategory=person)(objectclass=user)(sAMAccountName={{username}}))`

`HMD_LDAP_USERIDFIELD` says we want to use `sAMAccountName` as unique identifier for the account itself.

`HMD_LDAP_PROVIDERNAME` just the name written above the username and password field on the login page.


Same in json:

```json
"ldap": {
    "url": "ldap://internal.example.com",
    "bindDn": "cn=binduser,cn=Users,dc=internal,dc=example,dc=com",
    "bindCredentials": "<super secret password>",
    "searchBase": "dc=internal,dc=example,dc=com",
    "searchFilter": "(&(objectcategory=person)(objectclass=user)(|(sAMAccountName={{username}})(mail={{username}})))",
    "useridField": "sAMAccountName",
},
```

More details and example: https://www.npmjs.com/package/passport-ldapauth
