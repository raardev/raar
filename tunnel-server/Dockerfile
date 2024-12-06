FROM alpine:latest

# Install OpenSSH and required tools
RUN apk add --no-cache openssh openssl linux-pam \
    && ssh-keygen -A \
    && mkdir -p /run/sshd

# Add script to generate and display subdomain
COPY tunnel-command.sh /usr/local/bin/tunnel-command
RUN chmod +x /usr/local/bin/tunnel-command

# Add PAM configuration
COPY sshd /etc/pam.d/sshd

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
    # Security settings
    && echo "PermitRootLogin no" >> /etc/ssh/sshd_config \
    && echo "PubkeyAuthentication no" >> /etc/ssh/sshd_config \
    && echo "PasswordAuthentication no" >> /etc/ssh/sshd_config \
    && echo "ChallengeResponseAuthentication yes" >> /etc/ssh/sshd_config \
    && echo "KbdInteractiveAuthentication yes" >> /etc/ssh/sshd_config \
    && echo "AuthenticationMethods keyboard-interactive" >> /etc/ssh/sshd_config \
    && echo "UsePAM yes" >> /etc/ssh/sshd_config \
    # Performance
    && echo "UseDNS no" >> /etc/ssh/sshd_config \
    && echo "TCPKeepAlive yes" >> /etc/ssh/sshd_config \
    && echo "ForceCommand /usr/local/bin/tunnel-command" >> /etc/ssh/sshd_config

# Create a default authorized_keys file
RUN mkdir -p /etc/ssh/authorized_keys

EXPOSE 2222 10000-10099

CMD ["/usr/sbin/sshd", "-D", "-e"]
