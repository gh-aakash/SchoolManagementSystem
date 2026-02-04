variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "AMI ID for Ubuntu 22.04 LTS"
  type        = string
  # Ubuntu 22.04 LTS AMI (check current one for your region)
  default     = "ami-0c7217cdde317cfec" 
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Name of the EC2 key pair"
  type        = string
}
