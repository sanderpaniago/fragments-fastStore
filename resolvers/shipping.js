const { default: axios } = require("axios");

const { api } = require("store.config");

const shipping = async (_, { country, items, postalCode }) => {
  const { data } = await axios.post(
    `https://${api.storeId}.${api.environment}.com.br/api/checkout/pvt/orderForms/simulation`,
    {
      items,
      postalCode,
      country,
    },
    {
      headers: {
        "X-VTEX-API-AppKey": process.env.VTEX_APP_KEY,
        "X-VTEX-API-AppToken": process.env.VTEX_APP_TOKEN,
      },
    }
  );

  return data;
};

module.exports = shipping;
