# Changelog

## [2.1.2](https://github.com/yenilmez1234/pz-admin/compare/v2.1.1...v2.1.2) (2026-10-02)


### Bug Fixes

* fix update url ([5ea5e0c](https://github.com/yenilmez1234/pz-admin/commit/5ea5e0c47ba783350d61957605d506b812f8da21))

## [2.1.1](https://github.com/yenilmez1234/pz-admin/compare/v2.1.0...v2.1.1) (2026-10-02)


### Bug Fixes

* add signed update release test entry ([e63d0c8](https://github.com/yenilmez1234/pz-admin/commit/e63d0c87333bc739f36fcb9a9d31652119e30aad))

## [2.1.0](https://github.com/yenilmez1234/pz-admin/compare/v2.0.1...v2.1.0) (2026-10-02)


### Features

* **packaging:** generate AppStream release history from changelog ([874362c](https://github.com/yenilmez1234/pz-admin/commit/874362c4ac4f61b95515d817bbb0473ae3d9253b))
* **updates:** add signed startup updates for Windows and macOS ([9fa335e](https://github.com/yenilmez1234/pz-admin/commit/9fa335e67379bf2ec9612c32a44669e3f0de8de9))

## [2.0.1](https://github.com/yenilmez1234/pz-admin/compare/v2.0.0...v2.0.1) (2026-10-02)


### Bug Fixes

* **release-test:** verify patch bump and changelog history ([d28c747](https://github.com/yenilmez1234/pz-admin/commit/d28c747141196ac87f878a0874681b6e679ff07e))

## 2.0.0 (2026-10-02)


### Features

* **options:** add build-aware server option catalog ([232b4d3](https://github.com/yenilmez1234/pz-admin/commit/232b4d3a9fa73db553c3952f7481a02244c47a18))
* **options:** add server options service ([f019079](https://github.com/yenilmez1234/pz-admin/commit/f019079d9193eab14e1118effcacae3c4e99fee1))
* **options:** enrich build 41 option metadata ([0869241](https://github.com/yenilmez1234/pz-admin/commit/08692419a799a81b1221c8aaf6985dd485fdb45e))
* **options:** integrate message editor ([27d82fd](https://github.com/yenilmez1234/pz-admin/commit/27d82fda04c5966a620fa3ecafe827e8b1cbbeaf))
* **options:** integrate starting items editor ([13bd05f](https://github.com/yenilmez1234/pz-admin/commit/13bd05f383d0dcc13991017e6157e107fb1a0e1f))
* **session:** detect game build automatically ([31e4c12](https://github.com/yenilmez1234/pz-admin/commit/31e4c12b39451495c84019f5ee3822d7bcc31138))


### Bug Fixes

* add release workflow test entry ([04d0c11](https://github.com/yenilmez1234/pz-admin/commit/04d0c11e881fee76645947c7efe05dfdb1822dd7))
* **build:** avoid duplicate builds during packaging ([5821c31](https://github.com/yenilmez1234/pz-admin/commit/5821c31f75af7dfa03dec88bd3b70289bbaa3615))
* **ci:** correct packaging tool setup and target architecture ([93fa510](https://github.com/yenilmez1234/pz-admin/commit/93fa5100fd18751839b8a0df239eb6862e559919))
* **ci:** install Wails dependencies in frontend job ([7f34e16](https://github.com/yenilmez1234/pz-admin/commit/7f34e163552936a42f803416f92f344ffe61a82d))
* **ci:** restore Go caches before installing tools ([6391c6d](https://github.com/yenilmez1234/pz-admin/commit/6391c6d791a6bd53ca289e10173a857d75b22fc5))
* **frontend:** close confirmations after success ([34f77b9](https://github.com/yenilmez1234/pz-admin/commit/34f77b98538136825dbb072324f0bbe677e477cc))
* **frontend:** improve dialogs at low heights ([9337b42](https://github.com/yenilmez1234/pz-admin/commit/9337b420c9ca29388022887787966f9a854f6048))
* **frontend:** process theme colors in production ([6498db8](https://github.com/yenilmez1234/pz-admin/commit/6498db8172ca8eb33bb188c3acd371ed4225c874))
* **packaging:** require GTK 4.14 and enable Turkish installer ([8b8fd6d](https://github.com/yenilmez1234/pz-admin/commit/8b8fd6dc7cc42ba2e73e35342b3a7ce3d870701f))
* **packaging:** use friendly macOS name and detect glibc requirements ([2d90984](https://github.com/yenilmez1234/pz-admin/commit/2d90984d8e8af6246df4a2e0a348a2a41f4dd45f))


### Reverts

* restore English-only NSIS installer ([0585074](https://github.com/yenilmez1234/pz-admin/commit/0585074014a4500238af1f2f39e42d599d11bf82))
