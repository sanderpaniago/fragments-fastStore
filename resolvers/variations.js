const { default: axios } = require("axios");
const { GraphQLError } = require("graphql");

const { api } = require("store.config");

const Items = async (productData) => {
  try {
    const { data } = await axios.get(
      `https://${api.storeId}.${api.environment}.com.br/api/catalog_system/pub/products/search?fq=skuId:${productData.id}`
    );

    if (!data[0].items) {
      return new GraphQLError(`product not found ${productData.id}`);
    }

    const items = data[0].items.map(
      (item) =>
        item.itemId && {
          color: item.Cor[0],
          size: item.Tamanho[0],
          images: item.images,
          quantity: item.sellers[0].commertialOffer.AvailableQuantity,
          itemId: item.itemId,
        }
    );

    if (data[0].skuSpecifications) {
      return {
        items,
        skuSpecifications: data[0].skuSpecifications || [],
      };
    }

    return {
      items,
    };
  } catch (e) {
    new GraphQLError(`product not found ${productData.id}`);
  }
};

module.exports = Items;
