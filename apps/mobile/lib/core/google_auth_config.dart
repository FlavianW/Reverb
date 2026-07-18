/// Identifiant client OAuth Google (type "Web", même projet Google Cloud que
/// `GOOGLE_CLIENT_ID` côté API). Ce n'est pas un secret — contrairement au
/// client secret, un client ID est destiné à être embarqué côté client — il
/// sert ici de `serverClientId` à `google_sign_in` : l'app native obtient
/// ainsi un ID token dont l'audience correspond à ce que l'API vérifie déjà.
const kGoogleServerClientId =
    '34642845238-k1p5ht204a4o8jul1q7rknuhld3va0gt.apps.googleusercontent.com';
