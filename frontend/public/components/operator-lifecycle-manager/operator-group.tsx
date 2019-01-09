/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { MsgBox } from '../utils/status-box';
import { K8sResourceKind, referenceForModel, GroupVersionKind } from '../../module/k8s';
import { OperatorGroupKind } from './index';
import { AsyncComponent } from '../utils/async';
import { OperatorGroupModel } from '../../models';

export const targetNamespacesFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.targetNamespaces']);
export const operatorNamespaceFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.operatorNamespace']);
export const operatorGroupFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.operatorGroup']);

export const NoOperatorGroupMsg: React.SFC = () => <MsgBox
  title="Namespace Not Enabled"
  // TODO(alecmerdler): Better description + link to docs
  detail="The Operator Lifecycle Manager will not watch this namespace because it is not configured with an OperatorGroup." />;

type RequireOperatorGroupProps = {
  operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]};
};

export const OperatorGroupSelector: React.SFC<OperatorGroupSelectorProps> = (props) => <AsyncComponent
  loader={() => import('../utils/list-dropdown').then(m => m.ListDropdown)}
  onChange={props.onChange || function() {
    return null;
  }}
  desc="OperatorGroups"
  placeholder="Select Operator Group"
  selectedKeyKind={referenceForModel(OperatorGroupModel)}
  resources={props.namespace ?
    [{kind: referenceForModel(OperatorGroupModel), namespace: props.namespace}]
    : [{kind: referenceForModel(OperatorGroupModel)}]} />;

export const requireOperatorGroup = <P extends RequireOperatorGroupProps>(Component: React.ComponentType<P>) => {
  return class RequireOperatorGroup extends React.Component<P> {
    static WrappedComponent = Component;

    render() {
      const namespaceEnabled = !_.get(this.props.operatorGroup, 'loaded') || !_.isEmpty(this.props.operatorGroup.data);

      return namespaceEnabled
        ? <Component {...this.props} />
        : <NoOperatorGroupMsg />;
    }
  } as React.ComponentClass<P> & {WrappedComponent: React.ComponentType<P>};
};

export type OperatorGroupSelectorProps = {
  onChange?: (name: string, kind: GroupVersionKind) => void;
  namespace?: string;
};

NoOperatorGroupMsg.displayName = 'NoOperatorGroupMsg';
