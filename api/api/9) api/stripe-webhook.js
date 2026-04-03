export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  /*
  VERSION STRIPE RÉELLE :

  1) récupérer le raw body
  2) vérifier la signature avec STRIPE_WEBHOOK_SECRET
  3) si checkout.session.completed :
     - marquer la commande comme "paid"
     - appeler create-shipment
     - envoyer email de confirmation

  Ici il faudra ensuite relier à une vraie base de données.
  */

  return res.status(200).json({ received: true, mode: 'mock' });
}
