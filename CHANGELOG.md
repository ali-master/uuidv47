# Changelog

## [1.0.0](https://github.com/ali-master/uuidv47/compare/0.2.0...1.0.0) (2025-09-22)

### ⚠ BREAKING CHANGES

* replace UUIDv47 method calls with direct imports for less bundle size

### Features

* update project title in README for clarity ([3f857c3](https://github.com/ali-master/uuidv47/commit/3f857c3b9110e72a4484ed5c38686997548e4e18))
* **UUID:** preallocate result buffer using Buffer.from for security reason and correct typing as UUID128 ([89fea5a](https://github.com/ali-master/uuidv47/commit/89fea5adc5a1915052a2de838fb3e17e85fdf481))

### Bug Fixes

* **README:** update gzipped size to reflect accurate bundle size ([a097128](https://github.com/ali-master/uuidv47/commit/a0971287fca48763eed2415b0c1dafdd902e890a))

### Code Refactoring

* replace UUIDv47 method calls with direct imports for less bundle size ([f0b3000](https://github.com/ali-master/uuidv47/commit/f0b3000c6ef4e8ce5b007028b98a191989097750))

## [0.2.0](https://github.com/ali-master/uuidv47/compare/0.1.0...0.2.0) (2025-09-18)

### Features

* remove common js support options and use only module pattern ([b801825](https://github.com/ali-master/uuidv47/commit/b801825efd3fa81383d48ff444ca4a9092631dc3))
* update README with bundle size and performance metrics ([af9d808](https://github.com/ali-master/uuidv47/commit/af9d80843caa23415e15d014071669d2bfcc3042))

### Code Refactoring

* split the index.ts into multiple files ([beafee9](https://github.com/ali-master/uuidv47/commit/beafee90cf41a8dde1b1161ca509c17c21681bca))

## 0.1.0 (2025-09-18)

### Features

* add benchmarks for UUIDv47 core operations and key management ([4cee32f](https://github.com/ali-master/uuidv47/commit/4cee32f5583bda6073bbac5235a7a41af774eb5f))
* add CI/CD pipeline configuration ([26d9fef](https://github.com/ali-master/uuidv47/commit/26d9fef972803ca564fb8bae017fd02d7b142715))
* add logo and social preview SVGs, and update README ([b207a88](https://github.com/ali-master/uuidv47/commit/b207a88d43a710b397a7fe4d01b921d88a6e0766))
* add tests for UUIDv47 and SipHash functionality ([b25e993](https://github.com/ali-master/uuidv47/commit/b25e99345d5bb782eb4770153866541f103b6d97))
* add UUIDv47 examples and utility functions for console output ([6a91f3f](https://github.com/ali-master/uuidv47/commit/6a91f3f4855fe0e25281dabcb1031eaae37ce712))
* enhance CI/CD pipeline with improved secret scanning logic ([6c42270](https://github.com/ali-master/uuidv47/commit/6c42270372d76332bc2aa909f39d19b541515e41))
* implement UUIDv47 with SipHash and utility functions ([4a17d97](https://github.com/ali-master/uuidv47/commit/4a17d97ace9e2d987b2b65a4e8880dc1f2efbbf9))
* update logo and social preview SVGs for improved design ([99109fc](https://github.com/ali-master/uuidv47/commit/99109fc5953bd958bb0e07443e92196225d048ac))

### Chores

* initialize project structure and configuration files ([ad4e8ba](https://github.com/ali-master/uuidv47/commit/ad4e8bac09b74ec2d3a76066dc41866402d5c5f2))
