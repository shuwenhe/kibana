/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { durationToNumber } from '../../../common/schema_utils';
import { LevelLogger, startTrace } from '../';
import { HeadlessChromiumDriver } from '../../browsers';
import { CaptureConfig } from '../../types';
import { LayoutInstance } from '../layouts';
import { CONTEXT_WAITFORELEMENTSTOBEINDOM } from './constants';

type SelectorArgs = Record<string, string>;

const getCompletedItemsCount = ({ renderCompleteSelector }: SelectorArgs) => {
  return document.querySelectorAll(renderCompleteSelector).length;
};

/*
 * 1. Wait for the visualization metadata to be found in the DOM
 * 2. Read the metadata for the number of visualization items
 * 3. Wait for the render complete event to be fired once for each item
 */
export const waitForVisualizations = async (
  captureConfig: CaptureConfig,
  browser: HeadlessChromiumDriver,
  toEqual: number,
  layout: LayoutInstance,
  logger: LevelLogger
): Promise<void> => {
  const endTrace = startTrace('wait_for_visualizations', 'wait');
  const { renderComplete: renderCompleteSelector } = layout.selectors;

  logger.debug(
    i18n.translate('xpack.reporting.screencapture.waitingForRenderedElements', {
      defaultMessage: `waiting for {itemsCount} rendered elements to be in the DOM`,
      values: { itemsCount: toEqual },
    })
  );

  try {
    const timeout = durationToNumber(captureConfig.timeouts.renderComplete);
    await browser.waitFor(
      { fn: getCompletedItemsCount, args: [{ renderCompleteSelector }], toEqual, timeout },
      { context: CONTEXT_WAITFORELEMENTSTOBEINDOM },
      logger
    );

    logger.debug(`found ${toEqual} rendered elements in the DOM`);
  } catch (err) {
    logger.error(err);
    throw new Error(
      i18n.translate('xpack.reporting.screencapture.couldntFinishRendering', {
        defaultMessage: `An error occurred when trying to wait for {count} visualizations to finish rendering. You may need to increase '{configKey}'. {error}`,
        values: {
          count: toEqual,
          configKey: 'xpack.reporting.capture.timeouts.renderComplete',
          error: err,
        },
      })
    );
  }

  endTrace();
};
