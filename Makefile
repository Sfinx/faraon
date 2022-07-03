DEPLOY_HOST := root@c
DEPLOY_DIR := sfinx/back/cluster/nginx
BUILD_TIMESTAMP := $(shell date +"%Y-%m-%d %H:%M:%S")
COMMIT_ID := $(shell git describe --abbrev=24 --always)

bson:
	@echo "{ \
		 \"git\": \"${COMMIT_ID}\",\n\
		 \"buildStamp\": \"${BUILD_TIMESTAMP}\"\n\
	}" > build.json

deploy:
	@ssh $(DEPLOY_HOST) rm -rf $(DEPLOY_DIR)/dist
	@scp -qr dist $(DEPLOY_HOST):$(DEPLOY_DIR)
	@ssh $(DEPLOY_HOST) bash -c "date > $(DEPLOY_DIR)/marker"

u upgrade:
	@ncu -u
	@pnpm install
	@quasar upgrade -i

b build: bson upgrade
	@quasar build
	@echo Compressing..
	@cd dist/spa; brotli -q 11 *html *ico *png assets/*
	@cd dist/spa; gzip -q9 *html *ico *png
	@cd dist/spa/assets; gzip -q9 *js *css *woff *ttf

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
