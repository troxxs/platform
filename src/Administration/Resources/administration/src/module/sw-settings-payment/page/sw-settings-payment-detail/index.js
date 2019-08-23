import CriteriaFactory from 'src/core/factory/criteria.factory';
import template from './sw-settings-payment-detail.html.twig';
import './sw-settings-payment-detail.scss';

const { Component, State, Mixin } = Shopware;
const { warn } = Shopware.Utils.debug;

Component.register('sw-settings-payment-detail', {
    template,

    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('placeholder'),
        Mixin.getByName('discard-detail-page-changes')('paymentMethod')
    ],

    shortcuts: {
        'SYSTEMKEY+S': 'onSave',
        ESCAPE: 'onCancel'
    },

    data() {
        return {
            paymentMethod: {},
            mediaItem: null,
            uploadTag: 'sw-payment-method-upload-tag',
            ruleFilter: CriteriaFactory.multi(
                'OR',
                CriteriaFactory.contains('rule.moduleTypes.types', 'payment'),
                CriteriaFactory.equals('rule.moduleTypes', null)
            ),
            isLoading: false,
            isSaveSuccessful: false
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle(this.identifier)
        };
    },

    watch: {
        'paymentMethod.mediaId'() {
            if (this.paymentMethod.mediaId) {
                this.setMediaItem({ targetId: this.paymentMethod.mediaId });
            }
        }
    },

    computed: {
        identifier() {
            return this.placeholder(this.paymentMethod, 'name');
        },

        paymentMethodStore() {
            return State.getStore('payment_method');
        },

        ruleStore() {
            return State.getStore('rule');
        },

        mediaStore() {
            return State.getStore('media');
        },

        tooltipSave() {
            const systemKey = this.$device.getSystemKey();

            return {
                message: `${systemKey} + S`,
                appearance: 'light'
            };
        },

        tooltipCancel() {
            return {
                message: 'ESC',
                appearance: 'light'
            };
        }
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            if (this.$route.params.id) {
                this.paymentMethodId = this.$route.params.id;
                this.loadEntityData();
            }
        },

        onSaveRule(ruleId) {
            this.paymentMethod.availabilityRuleId = ruleId;
        },

        onDismissRule() {
            this.paymentMethod.availabilityRuleId = null;
        },

        abortOnLanguageChange() {
            return this.paymentMethod.hasChanges();
        },

        saveOnLanguageChange() {
            return this.onSave();
        },

        onChangeLanguage() {
            this.loadEntityData();
        },

        loadEntityData() {
            this.paymentMethod = this.paymentMethodStore.getById(this.paymentMethodId);
            if (this.paymentMethod.mediaId) {
                this.setMediaItem({ targetId: this.paymentMethod.mediaId });
            }
        },

        saveFinish() {
            this.isSaveSuccessful = false;
        },

        onSave() {
            const paymentMethodName = this.paymentMethod.name || this.placeholder(this.paymentMethod, 'name');
            const titleSaveError = this.$tc('global.notification.notificationSaveErrorTitle');
            const messageSaveError = this.$tc(
                'global.notification.notificationSaveErrorMessage', 0, { entityName: paymentMethodName }
            );
            this.isSaveSuccessful = false;
            this.isLoading = true;

            return this.paymentMethod.save().then(() => {
                this.isLoading = false;
                this.isSaveSuccessful = true;
                this.$refs.mediaSidebarItem.getList();
            }).catch((exception) => {
                this.createNotificationError({
                    title: titleSaveError,
                    message: messageSaveError
                });
                warn(this._name, exception.message, exception.response);
                this.isLoading = false;
                throw exception;
            });
        },

        onCancel() {
            this.$router.push({ name: 'sw.settings.payment.index' });
        },

        setMediaItem({ targetId }) {
            this.mediaStore.getByIdAsync(targetId).then((updatedMedia) => {
                this.mediaItem = updatedMedia;
            });
            this.paymentMethod.mediaId = targetId;
        },

        setMediaFromSidebar(mediaEntity) {
            this.mediaItem = mediaEntity;
            this.paymentMethod.mediaId = mediaEntity.id;
        },

        onUnlinkLogo() {
            this.mediaItem = null;
            this.paymentMethod.mediaId = null;
        },

        onDropMedia(mediaItem) {
            this.setMediaItem({ targetId: mediaItem.id });
        },

        openMediaSidebar() {
            this.$refs.mediaSidebarItem.openContent();
        }
    }
});
