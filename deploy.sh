#!/bin/bash
cd /home/karthik/chartsign/timesheet-be
git pull origin main
npm install
pm2 restart chartsign
