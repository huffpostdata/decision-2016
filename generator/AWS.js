'use strict'

const S3 = new (require('aws-sdk').S3)()

if (!process.env.S3_BUCKET) {
  throw new Error('You must set the S3_BUCKET environment variable to use AWS')
}
const BucketName = process.env.S3_BUCKET

class AWS {
  // Returns a Promise
  upload_asset(key, asset) {
    const params = this.build_params({
      Key: key.substring(1),
      Body: asset.data,
      ContentType: asset.content_type
    }, asset.max_age)
    console.log(`PUT s3://${params.Bucket}/${params.Key} ${params.ContentType} ${asset.max_age}`)
    return S3.putObject(params).promise()
  }

  upload_assets(assets) {
    const keys = Object.keys(assets)
    return keys.reduce((p, key) => p.then(() => this.upload_asset(key, assets[key])), Promise.accept())
  }

  upload_redirect(key, path) {
    const max_age = 30000
    const params = this.build_params({
      Key: key.substring(1),
      WebsiteRedirectLocation: path
    }, max_age)
    console.log(`PUT s3://${params.Bucket}/${params.Key} => ${path} ${max_age}`)
    return S3.putObject(params).promise()
  }

  // Returns a Promise
  upload_page(key, page) {
    if (key.startsWith('_test/')) return Promise.resolve() // We don't publish test pages
    if (page.hasOwnProperty('redirect')) return this.upload_redirect(key, page.redirect)

    const brokenKey = decodeURIComponent(key) // When AWS gets a GET request, it decodes the URI :(
    const max_age = 30000
    const params = this.build_params({
      Key: brokenKey.substring(1),
      Body: page.body,
      ContentType: page.headers['Content-Type']
    }, max_age)
    if (page.headers['Cache-Control']) params.CacheControl = page.headers['Cache-Control']
    console.log(`PUT s3://${params.Bucket}/${params.Key} ${params.ContentType} ${params.CacheControl}`)
    return S3.putObject(params).promise()
  }

  upload_pages(pages) {
    const keys = Object.keys(pages)
    return keys.reduce((p, key) => p.then(() => this.upload_page(key, pages[key])), Promise.accept())
  }

  upload_assets_and_pages(assets, pages) {
    return this.upload_assets(assets).then(() => this.upload_pages(pages))
  }

  build_params(params, max_age) {
    return Object.assign({
      Bucket: BucketName,
      ACL: 'public-read',
      CacheControl: `public, max-age=${Math.round(max_age / 1000)}`
    }, params)
  }
}

AWS.upload_assets_and_pages = (assets, pages) => {
  const aws = new AWS()
  return aws.upload_assets_and_pages(assets, pages)
}

module.exports = AWS
