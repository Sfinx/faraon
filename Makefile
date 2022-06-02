
BUILD_TIMESTAMP := $(shell date +"%Y-%m-%d %H:%M:%S")
COMMIT_ID := $(shell git describe --abbrev=24 --always)

bson:
	@echo "{ \
		 \"git\": \"${COMMIT_ID}\",\n\
		 \"buildStamp\": \"${BUILD_TIMESTAMP}\"\n\
	}" > build.json

u upgrade:
	@ncu -u
	@yarn
	@quasar upgrade -i

b build: bson upgrade
	@quasar build

d dev:	bson
	@quasar dev

envinfo:
	@npx envinfo --system --npmPackages vite,@vitejs/plugin-vue --binaries --browsers

i:
	@yarn cache clean; rm -rf node_modules; rm yarn.lock; yarn

push:
	@COMMITTER='Sfinx' COMMITTER_EMAIL=github@sfinx.in GIT_AUTHOR_EMAIL=github@sfinx.in GIT_AUTHOR_NAME='Sfinx' GIT_COMMITTER_EMAIL=github@sfinx.in GIT_COMMITTER_NAME='Sfinx' git push
