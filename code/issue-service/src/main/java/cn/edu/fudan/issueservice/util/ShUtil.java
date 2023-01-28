package cn.edu.fudan.issueservice.util;

import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;

/**
 * @author fancying
 * @author beethoven
 * @date 2021-07-01 15:08:22
 */
@Slf4j
public class ShUtil {

    public static boolean executeToolCommand(String tool, String logFile, String command, int timeout, String... args) {
        Process process = parseToProcess(command, args);
        if (process == null) {
            return false;
        }
        try (PrintWriter pw = new PrintWriter(new FileWriter(logFile))) {
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(new Date());
            pw.println(calendar.get(Calendar.YEAR) + calendar.get(Calendar.MONTH) + calendar.get(Calendar.DAY_OF_MONTH) + calendar.get(Calendar.HOUR)
                    + calendar.get(Calendar.MINUTE) + " " + process.pid() + " " + tool);
        } catch (IOException e) {
            log.warn("log file {} is not exist!", logFile);
        }
        return executeCommand(process, timeout);
    }

    private static boolean executeCommand(Process process, int timeout) {
        try {

            // true if the process has exited ;  false if the waiting time elapsed before the process has exited.
            boolean isProcessNormalExited = timeout == 0 ?
                    process.waitFor() == 0 :
                    process.waitFor(timeout, TimeUnit.SECONDS);
            if (!isProcessNormalExited) {
                process.destroy();
                log.error("invoke tool timeout ! ({}s)", timeout);
                return false;
            }
            return process.exitValue() == 0;
        } catch (InterruptedException e) {
            log.warn("command execute error, msg is: {}", e.getMessage());
        }
        return false;
    }


    /**
     * Execute Script
     *
     * @param command Script Command;
     * @param timeout Maximum waiting time in seconds; the value {@code 0} indicates normal
     *                termination.
     * @param args    Script Parameters
     * @return {@code true} if the process has exited and {@code false} if the waiting time elapsed before the process has exited.
     */
    public static boolean executeCommand(String command, int timeout, String... args) {
        Process process = parseToProcess(command, args);
        if (process == null) {
            return false;
        }
        return executeCommand(process, timeout);
    }

    public static Process parseToProcess(String command, String... args) {
        StringBuilder cmd = new StringBuilder(command);
        for (String arg : args) {
            cmd.append(" ");
            cmd.append(arg);
        }
        command = cmd.toString();
        log.info("command -> {}", command);
        try {
            Runtime rt = Runtime.getRuntime();
            return rt.exec(command);
        } catch (Exception e) {
            log.error("command execute error, command is: {}", command);
            log.error("exception msg is: {}", e.getMessage());
        }
        return null;
    }
}
