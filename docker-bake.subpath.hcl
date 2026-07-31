variable "IMAGE_TAG" {
  default = "latest"
}

variable "GIT_SHA" {
  default = ""
}

target "base" {
  context    = "."
  dockerfile = "Dockerfile.base"
  platforms  = ["linux/amd64", "linux/arm64"]
  cache-from = ["type=gha,scope=outline-subpath-base"]
  cache-to   = ["type=gha,mode=max,scope=outline-subpath-base"]
}

target "image" {
  context    = "."
  dockerfile = "Dockerfile"
  contexts = {
    "outline-base" = "target:base"
  }
  args = {
    BASE_IMAGE = "outline-base"
  }
  platforms = ["linux/amd64", "linux/arm64"]
  tags      = ["ghcr.io/23fo/outline:${IMAGE_TAG}"]
  labels = {
    "org.opencontainers.image.source"   = "https://github.com/23fo/outline_support_deployment_under_a_URL_subpath"
    "org.opencontainers.image.version"  = IMAGE_TAG
    "org.opencontainers.image.revision" = GIT_SHA
  }
  output     = ["type=registry"]
  cache-from = ["type=gha,scope=outline-subpath"]
  cache-to   = ["type=gha,mode=max,scope=outline-subpath"]
}
