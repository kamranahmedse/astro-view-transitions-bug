---
title: "Dynamically Load Ansible Inventory with EC2 IP"
description: "Learn how to dynamically populate the Ansible inventory with the IP address of EC2 instances."
seo:
  title: "Dynamically load IP address from EC2 in Ansible Inventory"
  description: "Learn how to dynamically populate the Ansible inventory with the IP address of EC2 instances."
isNew: true
type: "textual"
date: 2023-12-25
---

Ansible is a great tool for automating infrastructure provisioning. It is agentless, which means that you don't need to install anything on the target machine. It is also very easy to use and has a lot of modules that you can use to automate your infrastructure.

Ansible inventory is a file that contains a list of hosts that Ansible can connect to. It is used to define the hosts that Ansible will connect to and the run the tasks on. This file can be either static i.e. you define the hosts manually or dynamic i.e. you define the hosts using a script. Given below is an example of a static inventory file.

```ini
[web]
16.202.152.100
14.201.142.105

[db]
15.212.122.120
```

As you can see, we have two groups `[web]` and `[db]` with each group having some IP addresses. The problem with this approach is that if you have a lot of hosts, then it becomes very difficult to manage the inventory file. Also, if you have a dynamic infrastructure where hosts are added and removed frequently, then it becomes even more difficult to manage the inventory file.

In this article, we will learn how to dynamically populate the Ansible inventory with the IP address of EC2 instances.

## Tagging EC2 instances

The first step to make it easier to manage the inventory file is to tag the EC2 instances properly. I normally tag the EC2 instances with the following tags at the very least:

```
Project     = "web-address.com"
Component   = "{COMPONENT}"
Role        = "{ROLE}"
Name        = "{COMPONENT}-{ROLE}-{ENVIROMENT}"
Environment = "{ENVIRONMENT}"
ManagedBy   = "{MANAGED_BY}"
```

Details of what each tag means:

- **Component**: Name of the component if application consists of several different components e.g. `newsletter`, `blog`, `app`, etc.
- **Role**: Role of the EC2 instance e.g. `api` (backend API), `web` (customer facing app), `db` (database server), etc.
- **Environment**: Environment of the EC2 instance e.g. `production`, `staging`, `development`, etc.
- **ManagedBy**: How the EC2 instance is managed e.g. `terraform`, `ansible`, `manual`, etc.
- **Name**: This is the name of the EC2 instance. I normally use the following format: `{COMPONENT}-{ROLE}-{ENVIROMENT}` e.g. `app-api-production`, `newsletter-db-production`, `blog-web-staging`, etc.

Having these tags not only makes it easier to manage the inventory file but also makes it easier to manage the EC2 instances themselves e.g. you can easily find all the resources with specific tags, better analyse the cost of the infrastructure, etc.

## Dynamic Inventory

There is an Ansible module called `aws_ec2` that can be used to dynamically populate the inventory file with the IP address of EC2 instances. It can get the IP address of EC2 instances based on the tags that we have defined above and give us hostnames that we can use in our playbooks. It has a [pretty decent documentation](https://docs.ansible.com/ansible/latest/collections/amazon/aws/docsite/aws_ec2_guide.html) that you can refer to to get an idea of usage but I will go through the usage here:

First, we need to create a yaml file that will contain the configuration for the `aws_ec2` module. The filename must end with `aws_ec2.yml`, e.g. `csfyi.aws_ec2.yml`. The contents of the file should be as follows:

```yaml
plugin: aws_ec2
boto_profile: "{{ lookup('env', 'AWS_PROFILE') }}"
regions:
  - ap-south-1
filters:
  instance-state-name: running
keyed_groups:
  - key: tags.get('Component', 'unknown') + "_" + tags.get('Role', 'unknown') + "_" + tags.get('Environment', 'unknown')
    separator: ''
  - key: tags.get('Component', 'unknown') + "_" + tags.get('Role', 'unknown')
    separator: ''
```

Let's go through the configuration one by one:

- **plugin**: This is the name of the plugin that we are using. In our case, it is `aws_ec2`.
- **boto_profile**: This is the name of the AWS profile that we are using. We are using the value of the `AWS_PROFILE` environment variable here. This is useful if you have multiple AWS profiles configured on your machine.
- **regions**: This is the list of regions that we want to query for EC2 instances. In our case, we are only querying the `ap-south-1` region.
- **filters**: This is the list of filters that we want to apply to get the EC2 instances in our inventory. In our case, we are only querying the running instances.
- **keyed_groups**: This is where we are preparing the list of groups that we want to create in our inventory. The names of the groups are generated using the tags of the EC2 instances. We are creating two groups but you can add as many as you want
    - `{COMPONENT}_{ROLE}_{ENVIRONMENT}` e.g. `app_api_production`, `newsletter_db_production`, `blog_web_staging`, etc. This gives us the ability to run the playbooks on specific EC2 instances in a specific environment.
    - `{COMPONENT}_{ROLE}`: e.g. `app_api`, `newsletter_db`, `blog_web`, etc. This gives us the ability to run the playbooks on specific EC2 instances regardless of the environment.

Once we have created the configuration file, we can use the `aws_ec2` module to get the list of EC2 instances. We can do this by running the following command:

```bash
# Use --list or --graph to get the list of EC2 instances
ansible-inventory -i csfyi.aws_ec2.yml --list
ansible-inventory -i csfyi.aws_ec2.yml --graph

# Add AWS_PROFILE if you are using multiple profiles in your machine
AWS_PROFILE=csfyi ansible-inventory -i csfyi.aws_ec2.yml --list

# You can also use the following command to get the list of EC2 instances in a specific group
ansible-inventory -i csfyi.aws_ec2.yml --host ap p_api_production
```

If all goes well, you should see the list of EC2 instances in the output. Now that we have the inventory file ready, we can use it in the `ansible.cfg` file. You should add the following lines to the `ansible.cfg` file:

```ini
[defaults]
# ...
enable_plugins = aws_ec2
inventory = ./roadmap.aws_ec2.yml
# ...
```

Now, you can use the host names in your playbooks. For example, if you want to run a playbook on all the EC2 instances in the `app_api_production` group, then you can do the following:

```yaml
- name: Configure draw.roadmap.sh
  hosts: app_api_production  # Name generated by the aws_ec2 plugin
  become: yes
  become_method: sudo
  gather_facts: no
  roles:
    - { role: base, tags: [ 'base' ] }
    - { role: nginx, tags: [ 'nginx' ] }
```

## Conclusion

In this article, we learned how to dynamically populate the Ansible inventory with the IP address of EC2 instances. This makes it easier to manage the inventory file and also makes it easier to manage the EC2 instances themselves. I hope you found this article useful.