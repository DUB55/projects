# CI/CD Pipelines

Continuous Integration and Continuous Deployment.

## Concepts
- **Integration**: Every time you push code, it is automatically tested.
- **Deployment**: If the tests pass, the code is automatically sent to the live server.
- **GitHub Actions**: A popular tool for building these pipelines.

## Challenge
1. Set up a simple GitHub Action that runs `npm test` or `pytest` whenever you push code.
2. Ensure the build "fails" if a test doesn't pass.
