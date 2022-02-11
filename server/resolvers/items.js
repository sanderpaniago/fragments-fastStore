const { default: axios } = require('axios')
const { GraphQLError } = require('graphql')

const Items = async (productData) => {
  try {
    const { data } = await axios.get(
      `https://decathlonproqa.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=skuId:${productData.id}`
    )

    if (!data[0].items) {
      return new GraphQLError(`product not found ${productData.id}`)
    }

    const items = data[0].items.map((item) => {
      const variations = item.variations.map((variation) => ({
        name: variation,
        values: item[variation],
      }))

      const sellers = item.sellers.map((seller) => ({
        sellerDefault: seller.sellerDefault,
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        commertialOffer: {
          Price: seller.commertialOffer.Price,
          ListPrice: seller.commertialOffer.ListPrice,
          AvailableQuantity: seller.commertialOffer.AvailableQuantity,
        },
      }))

      return {
        itemId: item.itemId,
        name: item.name,
        images: item.images,
        variations,
        sellers,
      }
    })

    return items
  } catch (e) {
    new GraphQLError(`product not found ${productData.id}`)
  }
}

module.exports = Items
