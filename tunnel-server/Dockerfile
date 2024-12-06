FROM alpine:latest

# Install OpenSSH
RUN apk add --no-cache openssh \
    && ssh-keygen -A \
    && mkdir -p /run/sshd

# Configure sshd for tunneling only
RUN echo "Port 2222" >> /etc/ssh/sshd_config \
    && echo "GatewayPorts yes" >> /etc/ssh/sshd_config \
    && echo "AllowTcpForwarding yes" >> /etc/ssh/sshd_config \
    && echo "PermitOpen any" >> /etc/ssh/sshd_config \
    # Disable everything except port forwarding
    && echo "X11Forwarding no" >> /etc/ssh/sshd_config \
    && echo "AllowAgentForwarding no" >> /etc/ssh/sshd_config \
    && echo "PermitTTY no" >> /etc/ssh/sshd_config \
    # Connection settings
    && echo "ClientAliveInterval 30" >> /etc/ssh/sshd_config \
    && echo "ClientAliveCountMax 2" >> /etc/ssh/sshd_config \
    && echo "MaxStartups 100:30:150" >> /etc/ssh/sshd_config \
    && echo "MaxSessions 5" >> /etc/ssh/sshd_config \
    # Authentication
    && echo "AuthenticationMethods none" >> /etc/ssh/sshd_config \
    # Performance
    && echo "UseDNS no" >> /etc/ssh/sshd_config \
    && echo "TCPKeepAlive yes" >> /etc/ssh/sshd_config

EXPOSE 2222 10000-65535

CMD ["/usr/sbin/sshd", "-D", "-e"]
