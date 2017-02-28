# Access tokens

The purpose of this module is to create and validate access tokens, that can be used between different services, without them sharing data.

Take my two microservices mscp-entity and mscp-notes as examples. mscp-notes doesn't have any user database or notion of permissions. It does however (optionally) use this module, such that mscp-entity can create a link to a note, that will:

- Only provide required permission (read/write)
- Only provide access to the specific note
- Expire after 1-2 days.

The link (token) cannot be calculated by someone else, as it uses the sha265 hash function with a salt. The hashed value includes the entity id (in above example; the note id), the permission (read/write/...) and the current date.

By using the current date, a problem arises if you create a link before midnight and use it after. Therefore it also validates against a second hash of "yesterday".

Note that access will be cached and the cache is stored for 48 hours, which makes the access validation very fast if called multiple times.

The permission text can be anything that you want and you will only get access if it matches exactly.

## Usage

Generate token:

```
const AccessTokenManager = require("mscp-accesstokens");

let accessMan = new AccessTokenManager("secret")
let t = accessMan.genToken("myid", "read")
console.log(t)
```

Validate token:

```
const AccessTokenManager = require("mscp-accesstokens");

let accessMan = new AccessTokenManager("secret")
let gotAccess = accessMan.validateAccess("token", "myid", "read")
console.log(gotAccess ? "Access granted" : "Access denied")
```
