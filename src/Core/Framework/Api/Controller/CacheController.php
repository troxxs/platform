<?php declare(strict_types=1);

namespace Shopware\Core\Framework\Api\Controller;

use Shopware\Core\Framework\Adapter\Cache\CacheClearer;
use Shopware\Core\Framework\DataAbstractionLayer\Indexing\EntityIndexerRegistry;
use Shopware\Core\Framework\DataAbstractionLayer\Indexing\MessageQueue\IndexerMessageSender;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\Framework\Util\Random;
use Shopware\Storefront\Framework\Cache\CacheWarmer\CacheWarmer;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Cache\Adapter\AdapterInterface;
use Symfony\Component\Cache\Adapter\TagAwareAdapter;
use Symfony\Component\Cache\Adapter\TraceableAdapter;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @RouteScope(scopes={"api"})
 */
class CacheController extends AbstractController
{
    /**
     * @var CacheClearer
     */
    private $cacheClearer;

    /**
     * @var AdapterInterface
     */
    private $adapter;

    /**
     * @var IndexerMessageSender
     */
    private $indexerMessageSender;

    /**
     * @var CacheWarmer|null
     */
    private $cacheWarmer;

    /**
     * @var EntityIndexerRegistry
     */
    private $indexerRegistry;

    public function __construct(
        CacheClearer $cacheClearer,
        AdapterInterface $adapter,
        IndexerMessageSender $indexerMessageSender,
        ?CacheWarmer $cacheWarmer,
        EntityIndexerRegistry $indexerRegistry
    ) {
        $this->cacheClearer = $cacheClearer;
        $this->adapter = $adapter;
        $this->indexerMessageSender = $indexerMessageSender;
        $this->cacheWarmer = $cacheWarmer;
        $this->indexerRegistry = $indexerRegistry;
    }

    /**
     * @Route("/api/v{version}/_action/cache_info", name="api.action.cache.info", methods={"GET"})
     */
    public function info(): JsonResponse
    {
        return new JsonResponse([
            'environment' => getenv('APP_ENV'),
            'httpCache' => (bool) getenv('SHOPWARE_HTTP_CACHE_ENABLED'),
            'cacheAdapter' => $this->getUsedCache($this->adapter),
        ]);
    }

    /**
     * @Route("/api/v{version}/_action/index", name="api.action.cache.index", methods={"POST"})
     */
    public function index(): Response
    {
        $this->indexerMessageSender->partial(new \DateTime());

        $this->indexerRegistry->sendIndexingMessage();

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    /**
     * @Route("/api/v{version}/_action/cache_warmup", name="api.action.cache.delete_and_warmup", methods={"DELETE"})
     */
    public function clearCacheAndScheduleWarmUp(): Response
    {
        if ($this->cacheWarmer === null) {
            throw new \RuntimeException('Storefront is not installed');
        }

        $this->cacheWarmer->warmUp(Random::getAlphanumericString(32));

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    /**
     * @Route("/api/v{version}/_action/cache", name="api.action.cache.delete", methods={"DELETE"})
     */
    public function clearCache(): Response
    {
        $this->cacheClearer->clear();

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    /**
     * @Route("/api/v{version}/_action/container_cache", name="api.action.container-cache.delete", methods={"DELETE"})
     */
    public function clearContainerCache(): Response
    {
        $this->cacheClearer->clearContainerCache();

        return new Response('', Response::HTTP_NO_CONTENT);
    }

    private function getUsedCache(AdapterInterface $adapter): string
    {
        if ($adapter instanceof TagAwareAdapter || $adapter instanceof TraceableAdapter) {
            // Do not declare function as static
            $func = \Closure::bind(function () use ($adapter) {
                return $adapter->pool;
            }, $adapter, \get_class($adapter));

            $adapter = $func();
        }

        if ($adapter instanceof TraceableAdapter) {
            return $this->getUsedCache($adapter);
        }

        $name = \get_class($adapter);
        $parts = explode('\\', $name);
        $name = str_replace('Adapter', '', end($parts));

        return $name;
    }
}
