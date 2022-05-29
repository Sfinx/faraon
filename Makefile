
BUILD_TIMESTAMP := $(shell date +"%Y-%m-%d %H:%M:%S")
COMMIT_ID := $(shell git describe --abbrev=24 --always)

bson:
	@echo "{ \
		 \"git\": \"${COMMIT_ID}\",\n\
		 \"buildStamp\": \"${BUILD_TIMESTAMP}\"\n\
	}" > build.json
	
d dev:	bson
	@#ncu -u
	@yarn
	@quasar upgrade -i
	@quasar dev

envinfo:
	@npx envinfo --system --npmPackages vite,@vitejs/plugin-vue --binaries --browsers

i:
	@yarn cache clean; rm -rf node_modules; rm yarn.lock; yarn
 