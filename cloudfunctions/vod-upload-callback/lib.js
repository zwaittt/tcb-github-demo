const crypto = require('crypto');
const request = require('request-promise');
/**
 * 签名方法
 * @param {object} params 
 * @param {import('./config')} opts 
 * @param {number} timestamp 
 */
const signV3 = function(params, opts, timestamp) {
  console.log(opts);
  const headersToSign = {
    'content-type': 'application/json; charset=utf-8',
    host: opts.baseHost,
  };
  const headerKeys = Object.keys(headersToSign);
  const hashedPayload = crypto.createHash('sha256').update(JSON.stringify(params))
    .digest('hex');
  // 1
  const canonicalRequest = `${'POST' + '\n'
    + '/' + '\n'
    + '' + '\n'}${
    headerKeys.map(key => `${key}:${headersToSign[key]}\n`).join('')}\n${
    headerKeys.join(';')}\n${
    hashedPayload}`;
  // 2
  const credentialScope = `${utc(timestamp)}/${opts.serviceType}/` + 'tc3_request';
  const stringToSign = `${'TC3-HMAC-SHA256' + '\n'}${
    timestamp}\n${
    credentialScope}\n${
    crypto.createHash('sha256').update(canonicalRequest)
      .digest('hex')}`;
  // 3
  const { secretKey, secretId } = opts;
  const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(utc(timestamp))
    .digest();
  const secretService = crypto.createHmac('sha256', secretDate).update(opts.serviceType)
    .digest();
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request')
    .digest();
  // 4
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign)
    .digest('hex');
  return {
    signature,
    credentialScope,
    signedHeaders: headerKeys.join(';'),
  };
}

exports.yunApiRequest = async function (param, opts) {
  const { serviceType, apiVersion } = opts;
  const { secretKey, secretId } = opts;

  opts =  Object.assign(
    { maxKeys: 5000 },
    {
      baseHost: `${serviceType}.${opts.baseHost}`,
      path: '/',
      protocol: 'https',
    },
    {
      serviceType,
      secretKey,
      secretId,
    }
  );
  const url = `${opts.protocol}://${opts.baseHost}${opts.path}`;
  const timestamp = Math.round(Date.now() / 1000);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    Host: opts.baseHost,
    'X-TC-Action': param.Action,
    'X-TC-Version': apiVersion,
    'X-TC-Region': 'ap-guangzhou',
    'X-TC-Timestamp': timestamp,
  };
  Reflect.deleteProperty(param, 'Action');
  // 在此处算签名
  const { signature, credentialScope, signedHeaders } = signV3(param, opts, timestamp);
  const authorization = `${'TC3-HMAC-SHA256' + ' ' + 'Credential='}${secretId}/${credentialScope}, `
   + `SignedHeaders=${signedHeaders}, ` + `Signature=${signature}`;
  let reqOpts = {
    url,
    method: opts.method || 'POST',
    port: opts.protocol === 'http' ? 80 : 443,
    strictSSL: false,
    json: true,
    timeout: opts.timeout,
    headers: Object.assign(headers, {
      Authorization: authorization,
    }),
  };
  // method 是 post
  reqOpts.body = param;
  try {
    const res = await request(reqOpts);
    const responseBody = {
      code: 0,
      data: res,
    };
    if (res.Response.Error) {
      const { Code, Message } = res.Response.Error;
      responseBody.code = Code;
      responseBody.message = Message;
    }
    return responseBody;
  } catch (err) {
    throw err;
  }
};

function utc(s) {
  const date = s ? new Date(s * 1000) : new Date();
  const y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  let d = date.getUTCDate();
  if (m < 10) {
    m = `0${m}`;
  }
  if (d < 10) {
    d = `0${d}`;
  }
  return `${y}-${m}-${d}`;
}
