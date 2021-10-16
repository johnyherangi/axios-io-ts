# node-cli-template

## Actions

### RELEASE_TOKEN

Add a personal access token with `repo` and `webhook` permissions to your repository secrets with the name `RELEASE_TOKEN`. This allows the `release` workflow to fire the required `webhook` event that the `publish` workflow runs on.
