variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "cluster_name" {
  description = "EKS Cluster Name"
  type        = string
  default     = "bookflow-cluster"
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "prod"
}
