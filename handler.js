'use strict'

const Pop3Command = require('node-pop3')
const { S3 } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const { DateTime } = require('luxon')

const s3 = new S3({ region: process.env.region })

// process a batch of messages, returning number of messages processed
const processBatch = async () => {
  console.log('Checking for messages')
  const pop3 = new Pop3Command({
    user: process.env.username,
    password: process.env.password,
    host: 'pop.gmail.com',
    port: 995,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
    }
  })

  const list = await pop3.UIDL()
  for (const [msgNumber, uid] of list) {
    const [, messageStream] = await pop3.command('RETR', msgNumber)
    const path = `${DateTime.now().toFormat('yyyy/MM/dd')}/${uid}`
    console.log('Uploading', path)
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.bucket,
        Key: path,
        Body: messageStream
      }
    })
    await upload.done()
  }
  await pop3.QUIT()

  return list.length
}

// gmail hands out messages in batches, so process batches until no more
// messages found
module.exports.run = async (event, context) => {
  try {
    let n
    while (1) {
      n = await processBatch()
      console.log(n, 'messages found')
      if (n === 0) break
      console.log('sleeping 2 secs before next check')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } catch (err) {
    console.log('Error:', err)
  }
}
