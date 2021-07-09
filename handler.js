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
  console.log('processBatch starting')
  const result = await client.connect()
  console.log('connect result:', result)
  let list = result ? (await client.list()) : {}
  console.log('list:', list)
  for (let msgNum in list) {
    console.log('Retrieving', msgNum)
    const message = await client.retrieve(msgNum);
    console.log('Message length', message.toString().length)
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
  console.log('processBatch done')
  return Object.keys(list).length
}

// gmail hands out messages in batches, so process batches until no more
// messages found
module.exports.run = async (event, context) => {
  try {
    let n;
    while(1) {
      n = await processBatch()
      console.log(n, 'messages processed in batch')
      if (n == 0) break
      console.log('sleeping 2 secs before next check')
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('sleep finished')
    }
  }
  catch(err) {
    console.log('Error:', err)
  }
};
