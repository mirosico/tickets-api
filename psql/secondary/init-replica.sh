#!/bin/bash
set -e

# Create standby signal file
touch /var/lib/postgresql/data/standby.signal

# Start PostgreSQL
exec postgres -c config_file=/etc/postgresql/postgresql.conf 