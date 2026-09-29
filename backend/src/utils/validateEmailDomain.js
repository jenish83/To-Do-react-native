const dns = require('dns').promises;

const LOOKUP_TIMEOUT_MS = 5000;
// Public resolvers, because the machine's own DNS can refuse queries.
const resolver = new dns.Resolver();
resolver.setServers(['1.1.1.1', '8.8.8.8']);

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error('Email domain lookup timed out');
      err.code = 'ETIMEOUT';
      reject(err);
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// True when this DNS failure means "we could not check", not "the domain is fake".
function isLookupOutage(err) {
  return (
    err?.code === 'ETIMEOUT' ||
    err?.code === 'ESERVFAIL' ||
    err?.code === 'EREFUSED' ||
    err?.code === 'ECONNREFUSED'
  );
}

// null when the domain can receive mail, otherwise an error message.
// Throws on a DNS outage so the caller can ask the user to retry.
async function assertDeliverableEmail(email) {
  const domain = String(email).split('@')[1]?.trim().toLowerCase();
  if (!domain) return 'Please enter a valid email';

  try {
    const mx = await withTimeout(resolver.resolveMx(domain), LOOKUP_TIMEOUT_MS);
    if (mx.length > 0) return null;
  } catch (err) {
    if (isLookupOutage(err)) throw err;
  }

  // No MX record means this domain does not accept mail.
  // An A record alone is not enough: parked domains often have one.
  return 'Please use an email address from a real domain';
}

module.exports = { assertDeliverableEmail };
