package cn.edu.fudan.issueservice.util;

import java.io.EOFException;
import java.io.IOException;
import java.io.OutputStream;

/**
 * description: JDK11
 *
 * @author fancying
 * create: 2020-07-10 20:32
 **/
public abstract class InputStream extends java.io.InputStream {

    public static InputStream nullInputStream() {
        return new InputStream() {
            private volatile boolean closed;

            private void ensureOpen() throws IOException {
                if (closed) throw new IOException("Stream closed");
            }

            @Override
            public void close() throws IOException {
                closed = true;
            }


            @Override
            public int read() throws IOException {
                ensureOpen();
                return -1;
            }

            @Override
            public int read(byte[] b, int off, int len) throws IOException {
                ensureOpen();
                return len == 0 ? 0 : -1;
            }

            public byte[] readAllBytes() throws IOException {
                ensureOpen();
                return new byte[0];
            }

            public int readNBytes(byte[] b, int off, int len) throws IOException {
                ensureOpen();
                return 0;
            }

            public byte[] readNBytes(int len) throws IOException {
                ensureOpen();
                return new byte[0];
            }

            @Override
            public long skip(long n) throws IOException {
                ensureOpen();
                return 0L;
            }

            public void skipNBytes(long n) throws IOException {
                ensureOpen();
                if (n > 0) throw new EOFException();
            }

            @Override
            public int available() throws IOException {
                ensureOpen();
                return 0;
            }

            public long transferTo(OutputStream out) throws IOException {
                ensureOpen();
                return 0L;
            }
        };
    }
}