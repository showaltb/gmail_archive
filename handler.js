'use strict';

const { Client } = require('yapople')
const AWS = require('aws-sdk')
const strftime = require('strftime')
const { MD5 } = require('crypto-js')

const S3 = new AWS.S3()

const client = new Client({
  host: 'pop.gmail.com',
  port: 995,
  tls: true,
  username: process.env.username,
  password: process.env.password,
  options: {
    rejectUnauthorized: false
  }
})

// process a batch of messages, returning number of messages processed
const processBatch = async () => {
  await client.connect()
  let list = await client.list()
  for (let msgNum in list) {
    const message = await client.retrieve(msgNum);
    const hash = MD5(message.toString())
    const path = `${strftime('%Y/%m/%d')}/${hash}`
    console.log('Uploading', path)
    await S3.putObject({
      Bucket: process.env.bucket,
      Key: path,
      Body: message
    }).promise()
  }
  await client.quit()
  return Object.keys(list).length
}

// gmail hands out messages in batches, so process batches until no more
// messages found
module.exports.run = async (event, context) => {
  let n;
  do {
    n = await processBatch()
  } while (n > 0)
};
