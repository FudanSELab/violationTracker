import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Card,
  Input,
  Row,
  Col,
  Slider,
  InputNumber,
  Typography,
  Spin,
} from 'antd';

import { useStores } from '@/models';
import { Observer } from 'mobx-react';

// const BEGIN_COMMIT_ID = '1';

const Test8 = () => {
  const controller = useRef<AbortController>(new AbortController());
  const [repoUuid, setRepoUuid] = useState<string>(
    'ce84beed-d199-363f-acf8-2af8877d6ad7',
  );
  const [number, setNumber] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [frameIndex, setFrameIndex] = useState<number>(0);

  const { codePortraitStore } = useStores();

  const queryFileEvoluationByFrameIdx = useCallback(
    (repoUuid) => async (idx: number, from: string) => {
      // console.log('run twice', from);
      controller.current?.abort();
      controller.current = new AbortController();
      setLoading(true);
      return codePortraitStore
        .getFileEvoluationMapByIdx({ idx, repoUuid }, controller.current.signal)
        .then(() => {
          setLoading(false);
        });
    },
    [codePortraitStore],
  );

  useEffect(() => {
    if ((repoUuid ?? '') === '') return;
    codePortraitStore.clear();
    codePortraitStore
      .initialCodePortraitDataByRepoUuid({
        repoUuid: repoUuid ?? '',
        repoName: 'project',
        testValue: undefined,
        number,
      })
      .then(() => {
        queryFileEvoluationByFrameIdx(repoUuid)(0, 'init');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUuid, number, queryFileEvoluationByFrameIdx]);

  return (
    <Observer>
      {() => {
        const currentLineEvoRect: Omit<
          CP.LineItemWithEvoluation,
          'filePath' | 'fileUuid'
        >[] = codePortraitStore.fileList
          .map(({ lines }) => lines.filter(({ status }) => status.length > 0))
          .flat();
        return (
          <>
            <div>
              <Card
                title={
                  <>
                    TreeMap Debugger
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
                          queryFileEvoluationByFrameIdx(repoUuid)(e, 'slider');
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
                        queryFileEvoluationByFrameIdx(repoUuid)(e, 'input');
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
                      <td>Type</td>
                      <td>LineUuid</td>
                      <td>latest</td>
                      <td>current</td>
                      <td>relation</td>
                      <td>code</td>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentLineEvoRect) &&
                      currentLineEvoRect.map(
                        ({ lineUuid, type, latest, status }, idx) => (
                          <tr key={lineUuid} style={{ border: '1px solid' }}>
                            <td>{idx}</td>
                            <td>{type}</td>
                            <td>{lineUuid}</td>
                            <td>{latest}</td>
                            {loading ? (
                              idx === 0 ? (
                                <td>
                                  <Spin />
                                </td>
                              ) : (
                                <td />
                              )
                            ) : (
                              <>
                                <td>{status[frameIndex]?.current}</td>
                                <td>{status[frameIndex]?.relation}</td>
                                <td>{status[frameIndex]?.filePath}</td>
                                {/* <td>{status[frameIndex]?.code}</td> */}
                              </>
                            )}
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        );
      }}
    </Observer>
  );
};

export default Test8;
