# Scripts and samples of import data

This folder is a place to keep sample data and scripts to help developers with
creating/importing various pieces of data.

## Adding a base set of data to an empty instance

For creating a base set of data in a tackle-hub instance, a good place to start
is [tackle-hub's hack folder](https://github.com/konveyor/tackle2-hub/tree/main/hack).
If you have hub running or port forwarded on port :9002, a basic set of data can be
added to the instance by:

```sh
> git clone https://github.com/konveyor/tackle2-hub.git
> cd tackle2-hub/hack
> HOST=localhost:9002 ./add/all.sh
```
