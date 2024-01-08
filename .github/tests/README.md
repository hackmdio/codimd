# Test github actions with act

```bash
act pull_request --container-architecture linux/arm64 -e .github/tests/pull-request.json -j ch
eck-release-pr -P ubuntu-latest=catthehacker/ubuntu:act-latest
```
