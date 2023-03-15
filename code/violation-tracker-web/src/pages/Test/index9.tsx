import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Input,
  Row,
  Col,
  Slider,
  InputNumber,
  Typography,
  Spin,
  Avatar,
  Divider,
  Button,
  Modal,
} from 'antd';

import { useStores } from '@/models';
import { Observer } from 'mobx-react';

import './styles9.less';
import { COLORLIST } from '@/color';
import { str2number } from '@/utils/conversion';
import CodeDiff from '@/components/CodeDiff';

// const BEGIN_COMMIT_ID = '1';

const transformRelationColor = new Map<CP.ChangeRelation, string>([
  ['ADD', 'mediumseagreen'],
  ['CHANGE', 'cornflowerblue'],
  ['CHANGE_LINE', '#cfcfcf'],
  ['DELETE', 'red'],
  ['KEEP', '#b5dcff'],
  ['HIDDEN', 'transparent'],
]);

function renderCurrRelationLine(
  current: CP.LineCurrentType,
  relation: CP.ChangeRelation,
  // onClick: (event: any) => void,
) {
  // console.log(current, relation);
  if (current === 'NIL' && relation !== 'DELETE') {
    return <></>;
  }
  return (
    <div
      // onClick={onClick}
      style={{
        // cursor: 'pointer',
        borderTop: `2px solid ${
          transformRelationColor.get(relation) ?? 'white'
        }`,
      }}
    />
  );
}

const Test9 = () => {
  const [repoUuid, setRepoUuid] = useState<string>(
    'ce84beed-d199-363f-acf8-2af8877d6ad7',
  );
  const [number, setNumber] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [lineIdx, setLineIdx] = useState<number>(0);
  const [statusIdx, setStatusIdx] = useState<number>(0);
  const [tipDetail, setTipDetail] = useState<
    CP.CommitItem & { code: string }
  >();

  const { codePortraitStore } = useStores();

  const queryFileEvoluationByFrameIdx = useCallback(
    (repoUuid) => async (idx: number) => {
      return codePortraitStore.getFileEvoluationMapByIdx({ idx, repoUuid });
    },
    [codePortraitStore],
  );

  useEffect(() => {
    document
      .getElementById('_line_tip_')
      ?.setAttribute('style', 'display: none;');
    if ((repoUuid ?? '') === '') return;
    setLoading(true);
    codePortraitStore.clear();
    codePortraitStore
      .initialCodePortraitDataByRepoUuid({
        repoUuid: repoUuid ?? '',
        repoName: 'project',
        testValue: undefined,
        number,
        // repoUuid: 'f9f29181-d897-3e24-8185-361bfb2cf6e9',
        // beginCommitId: 'f8af975289ac89af13c0d3d5f03b446d42eaa11c',
        // endCommitId: 'e122faa4a361d18538abf2ea405f4fedc54a15a9',
      })
      .then(() => {
        return queryFileEvoluationByFrameIdx(
          repoUuid,
          // 'f9f29181-d897-3e24-8185-361bfb2cf6e9',
        )(0);
      })
      .then(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUuid, number, queryFileEvoluationByFrameIdx]);

  const clickShowCommitDetail = useCallback(
    (lineIdx: number, idx: number, code: string) => (event: any) => {
      setLineIdx(lineIdx);
      setStatusIdx(idx);
      const pointerEvent = event.nativeEvent as PointerEvent;
      // console.log(pointerEvent);
      const tip = document.getElementById('_line_tip_');
      const bias = {
        x: 10,
        y: -15,
      };
      if (tip?.getAttribute('style')?.includes('none')) {
        tip?.setAttribute(
          'style',
          `left: ${(pointerEvent as any).layerX + bias.x}px; top: ${
            (pointerEvent as any).layerY + bias.y
          }px`,
        );
      } else {
        tip?.setAttribute('style', 'display: none');
      }
      setTipDetail({ ...codePortraitStore.commits[idx], code });
      // console.log(event.nativeEvent, codePortraitStore.keys[idx]);
    },
    [codePortraitStore.commits],
  );

  return (
    <Observer>
      {() => {
        const currentLineEvoRect: Omit<
          CP.LineItemWithEvoluation,
          'filePath' | 'fileUuid'
        >[] = codePortraitStore.fileList
          .map(({ lines }) =>
            lines.filter(
              ({ status }) =>
                status.length > 0 &&
                status.some(
                  ({ relation }) =>
                    relation !== 'KEEP' && relation !== 'HIDDEN',
                ),
            ),
          )
          .flat();
        const statusLen =
          Array.isArray(currentLineEvoRect) && currentLineEvoRect.length > 0
            ? currentLineEvoRect[0].status.length
            : 0;
        // console.log(statusLen);
        return (
          <>
            <div>
              <Card
                title={
                  <>
                    Line Portrait
                    <Input.Group compact>
                      <InputNumber
                        style={{ width: 100 }}
                        // addonBefore="num"
                        defaultValue={number}
                        onChange={(e) => setNumber(e)}
                      />
                      <Input.Search
                        style={{ width: 250 }}
                        defaultValue={repoUuid}
                        onSearch={(v) => setRepoUuid(v)}
                      />
                    </Input.Group>
                  </>
                }
              >
                <Row style={{ marginBottom: 10 }}>
                  <Col
                    span={22}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ maxWidth: '400px', overflow: 'auto' }}>
                      <Slider
                        // range={{ draggableTrack: true }}
                        style={{
                          width: codePortraitStore.keys.length * 20,
                          display: 'inline-block',
                          margin: '5px 10px',
                          marginRight: '30px',
                        }}
                        dots
                        value={frameIndex}
                        min={0}
                        max={codePortraitStore.keys.length - 1}
                        marks={codePortraitStore.keys.map((_, index) => ({
                          [index]: {
                            label: '' + index,
                          },
                        }))}
                        onChange={(e: number) => {
                          setFrameIndex(e);
                          queryFileEvoluationByFrameIdx(repoUuid)(e);
                        }}
                      />
                    </div>
                    <InputNumber
                      style={{ margin: '0 10px' }}
                      size="small"
                      min={0}
                      max={codePortraitStore.keys.length - 1}
                      value={frameIndex}
                      onChange={(e: number) => {
                        setFrameIndex(e);
                        queryFileEvoluationByFrameIdx(repoUuid)(e);
                      }}
                    />
                    <Typography.Text>
                      commit个数：{codePortraitStore.keys.length}
                    </Typography.Text>
                  </Col>
                </Row>
                <table>
                  <thead>
                    <tr>
                      <td></td>
                      <td>type</td>
                      <td>LineUuid</td>
                      <td>latest</td>
                      {new Array(statusLen).fill(0).map((_, idx) => (
                        <td key={`head_${idx}`} style={{ width: 20 }}>
                          {idx}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td>
                          <Spin />
                        </td>
                      </tr>
                    ) : (
                      Array.isArray(currentLineEvoRect) &&
                      currentLineEvoRect.map(
                        ({ lineUuid, type, latest, status }, lineIdx) => (
                          <tr key={lineUuid}>
                            <td>{lineIdx}</td>
                            <td>{type}</td>
                            <td>{lineUuid}</td>
                            <td>{latest}</td>
                            {status.map(({ current, relation, code }, idx) => {
                              const key = `${lineUuid}_${idx}`;
                              if (current === undefined) {
                                return idx === 0 ? (
                                  <td key={key}>
                                    <Spin />
                                  </td>
                                ) : (
                                  <td key={key} />
                                );
                              } else {
                                return (
                                  <td
                                    key={key}
                                    style={{ cursor: 'pointer' }}
                                    onClick={clickShowCommitDetail(
                                      lineIdx,
                                      idx,
                                      code,
                                    )}
                                  >
                                    {renderCurrRelationLine(current, relation)}
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
                <div id="_line_tip_" style={{ display: 'none' }}>
                  <span className="line-tips-arrow-bottom"></span>
                  <menu id="_line_tip_container_">
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: 'max-content',
                      }}
                    >
                      <div className="summary-line">
                        <Avatar
                          style={{
                            backgroundColor:
                              COLORLIST[
                                str2number(tipDetail?.committer) %
                                  COLORLIST.length
                              ],
                            verticalAlign: 'middle',
                          }}
                          size="small"
                          gap={2}
                        >
                          {(tipDetail?.committer ?? '')[0]}
                        </Avatar>
                        <span style={{ marginLeft: '5px' }}>
                          {tipDetail?.committer ?? ''}
                        </span>
                        <Divider type="vertical" />
                        <Typography.Text code>
                          {tipDetail?.commitId}
                        </Typography.Text>
                      </div>
                      <p>
                        <Typography.Text>
                          {tipDetail?.commitDate}
                        </Typography.Text>
                      </p>
                      <Typography.Paragraph
                        style={{
                          margin: 0,
                          paddingLeft: '15px',
                          maxWidth: 500,
                        }}
                        ellipsis={
                          (tipDetail?.message ?? '').length > 10
                            ? { rows: 2, expandable: true, symbol: 'more' }
                            : false
                        }
                      >
                        "{tipDetail?.message ?? '暂无'}"
                      </Typography.Paragraph>
                      <Button type="link" onClick={() => setShowDiff(true)}>
                        与之前比较
                      </Button>
                      <Typography.Paragraph
                        style={{
                          margin: 0,
                          maxHeight: '170px',
                          maxWidth: '550px',
                          overflow: 'auto',
                        }}
                      >
                        <pre style={{ whiteSpace: 'pre' }}>
                          {(tipDetail === undefined ||
                          (tipDetail.code ?? '') === ''
                            ? 'No data'
                            : tipDetail.code
                          )
                            .replace(/\t/g, ' ')
                            .trim()}
                        </pre>
                      </Typography.Paragraph>
                    </div>
                  </menu>
                  <span className="line-tips-arrow-top"></span>
                </div>
              </Card>
            </div>
            <Modal
              width={800}
              visible={showDiff}
              onCancel={() => setShowDiff(false)}
            >
              {currentLineEvoRect[lineIdx] !== undefined &&
                Array.isArray(currentLineEvoRect[lineIdx].status) &&
                currentLineEvoRect[lineIdx].status.length > statusIdx && (
                  <CodeDiff
                    diffDataList={[
                      {
                        prevData:
                          statusIdx <= 0
                            ? ''
                            : currentLineEvoRect[lineIdx]?.status[statusIdx - 1]
                                .code,
                        oldHeader:
                          statusIdx <= 0
                            ? ''
                            : currentLineEvoRect[lineIdx]?.status[statusIdx - 1]
                                .filePath,
                        newData:
                          currentLineEvoRect[lineIdx]?.status[statusIdx].code,
                        newHeader:
                          currentLineEvoRect[lineIdx]?.status[statusIdx]
                            .filePath,
                      },
                    ]}
                    outputFormat="line-by-line"
                  />
                )}
            </Modal>
          </>
        );
      }}
    </Observer>
  );
};

export default Test9;
