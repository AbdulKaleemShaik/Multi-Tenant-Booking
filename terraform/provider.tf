provider "aws" {
  region = var.aws_region
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "bookflow-tf-state-118903272617"
    key    = "bookflow/terraform.tfstate"
    region = "ap-south-1"
  }
}
