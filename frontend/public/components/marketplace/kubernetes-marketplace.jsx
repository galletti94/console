import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {Helmet} from 'react-helmet';

import {Firehose, PageHeading, StatusBox} from '../utils';
import {referenceForModel} from '../../module/k8s';
import {PackageManifestModel} from '../../models';
import {MarketplaceTileViewPage} from './kubernetes-marketplace-items';
import * as operatorImg from '../../imgs/operator.svg';

const normalizePackageManifests = (packageManifests, kind) => {
  const activePackageManifests = _.filter(packageManifests, packageManifest => {
    return !packageManifest.status.removedFromBrokerCatalog;
  });
  return _.map(activePackageManifests, packageManifest => {
    const name = packageManifest.metadata.name;
    const uid = `${name}/${packageManifest.status.catalogSourceNamespace}`;
    const defaultIconClass = 'fa fa-clone'; // TODO: get this info from the packagemanifest
    const iconObj = _.get(packageManifest, 'status.channels[0].currentCSVDesc.icon[0]');
    const imgUrl = iconObj ? `data:${iconObj.mediatype};base64,${iconObj.base64data}` : operatorImg;
    const iconClass = imgUrl ? null : defaultIconClass;
    const provider = _.get(packageManifest, 'metadata.labels.provider');
    const tags = packageManifest.metadata.tags;
    const version = _.get(packageManifest, 'status.channels[0].currentCSVDesc.version');
    const currentCSVAnnotations = _.get(packageManifest, 'status.channels[0].currentCSVDesc.annotations', {});
    const {
      description,
      certifiedLevel,
      healthIndex,
      repository,
      containerImage,
      createdAt,
      support,
      longDescription,
      categories,
    } = currentCSVAnnotations;
    const categoryArray = categories && _.map(categories.split(','), category => category.trim());
    return {
      obj: packageManifest,
      kind,
      name,
      uid,
      iconClass,
      imgUrl,
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
      longDescription,
      categories: categoryArray,
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
  return _.sortBy([...packageManifestItems], 'name');
};

class MarketplaceListPage extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedItem: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const {packagemanifests} = props;
    if (packagemanifests !== state.packagemanifests) {
      const items = getItems(props);
      return {items, packagemanifests};
    }
  }

  render() {
    const {loaded, loadError} = this.props;
    const {items} = this.state;
    return <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources">
      <MarketplaceTileViewPage items={items} />
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
    namespace: 'marketplace',
    prop: 'packagemanifests',
  });
  return <Firehose resources={resources}>
    <MarketplaceListPage />
  </Firehose>;
};
Marketplace.displayName = 'Marketplace';

export const MarketplacePage = () => {
  return <Marketplace />
};
