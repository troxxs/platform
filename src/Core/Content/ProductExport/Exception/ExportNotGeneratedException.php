<?php declare(strict_types=1);

namespace Shopware\Core\Content\ProductExport\Exception;

use Shopware\Core\Framework\ShopwareHttpException;

class ExportNotGeneratedException extends ShopwareHttpException
{
    public function __construct()
    {
        parent::__construct('Export file has not been generated yet. Please make sure that the scheduled task are working or run the command manually.');
    }

    public function getErrorCode(): string
    {
        return 'CONTENT__PRODUCT_EXPORT_NOT_GENERATED';
    }
}