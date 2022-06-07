
BUILD_TIMESTAMP := $(shell date +"%Y-%m-%d %H:%M:%S")
COMMIT_ID := $(shell git describe --abbrev=24 --always)

bson:
	@echo "{ \
		 \"git\": \"${COMMIT_ID}\",\n\
		 \"buildStamp\": \"${BUILD_TIMESTAMP}\"\n\
	}" > build.json

u upgrade:
	@ncu -u
	@pnpm install
	@quasar upgrade -i

b build: bson upgrade
	@quasar build

d dev:	bson
	@quasar dev

envinfo:
	@npx envinfo --system --npmPackages vite,@vitejs/plugin-vue --binaries --browsers

yarn-reinstall:
	@yarn cache clean; rm -rf node_modules yarn.lock; yarn

pnpm-reinstall:
	@rm -rf node_modules pnpm-lock.yaml ~/.local/share/pnpm/store; pnpm install

commit:
	@COMMITTER='Sfinx' COMMITTER_EMAIL=github@sfinx.in GIT_AUTHOR_EMAIL=github@sfinx.in GIT_AUTHOR_NAME='Sfinx' GIT_COMMITTER_EMAIL=github@sfinx.in GIT_COMMITTER_NAME='Sfinx' git commit -a
