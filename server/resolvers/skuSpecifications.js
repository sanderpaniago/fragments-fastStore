const { default: axios } = require('axios')
const { GraphQLError } = require('graphql')

const skuSpecifications = async (productData) => {
  try {
    const { data } = await axios.get(
      `https://decathlonproqa.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=skuId:${productData.id}`
    )

    if (!data[0]) {
      return new GraphQLError(`product not found ${productData.id}`)
    }

    return (
      data[0].skuSpecifications.map((item) => ({
        field: {
          originalName: item.field.name,
          name: item.field.name,
        },
        values: item.values.map((value) => ({
          name: value.name,
          originalName: value.name,
        })),
      })) || []
    )
  } catch (e) {
    new GraphQLError(`product not found ${productData.id}`)
  }
}

module.exports = skuSpecifications
