import template from './sw-product-modal-delivery.html.twig';
import './sw-product-modal-delivery.scss';

const { Component } = Shopware;

Component.register('sw-product-modal-delivery', {
    template,

    inject: ['repositoryFactory'],

    props: {
        product: {
            type: Object,
            required: true
        },

        selectedGroups: {
            type: Array,
            required: true
        }
    },

    data() {
        return {
            activeTab: 'order',
            isLoading: false
        };
    },

    computed: {
        productRepository() {
            return this.repositoryFactory.create('product');
        }
    },

    methods: {
        saveDeliveryConfiguration() {
            this.isLoading = true;

            // Handle variant listing modes (single, expanded) if exists
            this.product = this.handleExpandedListing(this.product);

            // Save the product after generating
            this.productRepository.save(this.product, Shopware.Context.api).then(() => {
                this.$emit('configuration-close');
            });
        },

        cancelDeliveryConfiguration() {
            this.$emit('configuration-close');
        },

        handleExpandedListing(product) {
            if (product && product.listingMode !== 'single') {
                product.mainVariant = null;
            }

            delete product.listingMode;

            return product;
        }
    }
});
