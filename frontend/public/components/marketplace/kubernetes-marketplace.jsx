import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import CatalogTileView from 'patternfly-react-extensions/dist/esm/components/CatalogTileView/CatalogTileView';
import CatalogTile from 'patternfly-react-extensions/dist/esm/components/CatalogTile/CatalogTile';

import {Firehose, PageHeading, StatusBox} from '../utils';
import {referenceForModel} from '../../module/k8s';
import {normalizeIconClass} from '../catalog-item-icon';
import {PackageManifestModel} from '../../models';
import {MarketplaceModalOverlay} from './modal-overlay';

const normalizePackageManifests = (packageManifests, kind) => {
  const activePackageManifests = _.filter(packageManifests, packageManifest => {
    return !packageManifest.status.removedFromBrokerCatalog;
  });
  return _.map(activePackageManifests, packageManifest => {
    const tileName = packageManifest.metadata.name;
    const iconClass = 'fa fa-clone'; // TODO: get this info from the packagemanifest
    const iconObj = _.get(packageManifest, 'status.channels[0].currentCSVDesc.icon[0]');
    const tileImgUrl = iconObj && `data:${iconObj.mediatype};base64,${iconObj.base64data}`;
    const tileIconClass = tileImgUrl ? null : iconClass;
    const provider = _.get(packageManifest, 'metadata.labels.provider');
    const tags = packageManifest.metadata.tags;
    const version = _.get(packageManifest, 'status.channels[0].currentCSVDesc.version');
    const currentCSVAnnotations = _.get(packageManifest, 'status.channels[0].currentCSVDesc.annotations', {});
    const { description, certifiedLevel, healthIndex, repository, containerImage, createdAt, support } = currentCSVAnnotations;
    return {
      obj: packageManifest,
      kind,
      tileName,
      tileIconClass,
      tileImgUrl,
      description,
      provider,
      tags,
      version,
      certifiedLevel,
      healthIndex,
      repository,
      containerImage,
      createdAt,
      support,
    };
  });
};

const getItems = (props) => {
  const {packagemanifests, loaded} = props;
  let packageManifestItems = null;
  if (!loaded || !packagemanifests) {
    return [];
  }
  packageManifestItems = normalizePackageManifests(packagemanifests.data, 'PackageManifest');
  return _.sortBy([...packageManifestItems], 'tileName');
};

class MarketplaceListPage extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedTile: null
    };
  }

  static getDerivedStateFromProps(props, state) {
    const {packagemanifests} = props;
    if (packagemanifests !== state.packagemanifests) {
      const items = getItems(props);
      return {items, packagemanifests};
    }
  }

  toggleOpen(item) {
    this.setState(prevState => {
      const selectedTile = prevState.selectedTile === item ? null : item;
      return { selectedTile };
    });
  }

  renderTiles() {
    const {items} = this.state;

    return (
      <CatalogTileView.Category totalItems={items.length} viewAll={true}>
        {_.map(items, ((item) => {
          const {obj, tileName, tileImgUrl, tileIconClass, provider, description} = item;
          const uid = obj.metadata.uid;
          const iconClass = tileIconClass ? `icon ${normalizeIconClass(tileIconClass)}` : null;
          const vendor = provider ? `Provided by ${provider}` : null;
          return <CatalogTile
            id={uid}
            key={uid}
            title={tileName}
            iconImg={tileImgUrl}
            iconClass={iconClass}
            vendor={vendor}
            description={description}
            onClick={() => this.toggleOpen(item)}
          />;
        }))}
      </CatalogTileView.Category>
    );
  }

  render() {
    const {loaded, loadError} = this.props;
    const {items, selectedTile} = this.state;
    return <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources">
      <div className="co-catalog-page">
        <div className="co-catalog-page__content">
          <div className="co-catalog-page__num-items">{_.size(items)} items</div>
          <CatalogTileView>
            {this.renderTiles()}
          </CatalogTileView>
          {selectedTile &&
          <MarketplaceModalOverlay item={selectedTile} close={() => this.toggleOpen(null)} openSubscribe={/* TODO */} />}
        </div>
      </div>
    </StatusBox>;
  }
}
MarketplaceListPage.displayName = 'MarketplaceList';
MarketplaceListPage.propTypes = {
  obj: PropTypes.object,
};

export const Marketplace = () => {
  const resources = [];
  resources.push({
    isList: true,
    kind: referenceForModel(PackageManifestModel),
    namespace: undefined, // shows operators from all-namespaces - when backend is hooked up we will use 'marketplace'
    prop: 'packagemanifests'
  });
  return <Firehose resources={resources}>
    <MarketplaceListPage />
  </Firehose>;
};
Marketplace.displayName = 'Marketplace';

export const MarketplacePage = () => {
  return <React.Fragment>
    <Helmet>
      <title>Kubernetes Marketplace</title>
    </Helmet>
    <div className="co-catalog">
      <PageHeading title="Kubernetes Marketplace" />
      <Marketplace />
    </div>
  </React.Fragment>;
};
