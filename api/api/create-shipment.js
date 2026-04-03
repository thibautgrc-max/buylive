export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const order = req.body || {};

  // Ici tu branches :
  // - Mondial Relay pour relais / locker
  // - Chronopost pour domicile
  // Puis tu retournes :
  // trackingNumber, labelUrl, carrier, shipmentId

  return res.status(200).json({
    ok: true,
    carrier: order.shippingMethod || 'mondialrelay',
    trackingNumber: `TRK-${Date.now().toString().slice(-8)}`,
    labelUrl: `/labels/${order.id || 'mock'}.pdf`,
    shipmentId: `SHP-${Date.now().toString().slice(-7)}`
  });
}
