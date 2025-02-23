# Moneymaker

## Build and push image
```
docker buildx build --platform linux/amd64 \
    --memory=4g \
    --memory-swap=4g \
    --build-arg BUILDKIT_STEP_LOG_MAX_SIZE=10485760 \
    -t quay.io/str_netappontour/moneymaker:0.1.0 \
    --push .
```
